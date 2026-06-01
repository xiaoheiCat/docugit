# Updated automatically by the Release workflow after each main-branch release.
# Install: brew tap xiaoheiCat/docugit https://github.com/xiaoheiCat/docugit && brew install docugit

class Docugit < Formula
  desc "Git-based version control for Office OpenXML documents"
  homepage "https://github.com/xiaoheiCat/docugit"
  version "2026.06.01_11.33.51_376d10"
  license "GPL-3.0"

  on_macos do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_11.33.51_376d10/docugit-darwin-arm64"
      sha256 "10d545c4e4a2e03d987fa1f7964a7445c2a7c0efb8405c047c82d2706c2ebca2"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_11.33.51_376d10/docugit-darwin-amd64"
      sha256 "7f7a4ace00b989a02850f462ece6c605ed922d2fc6bc2f1958cd716bfae82491"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_11.33.51_376d10/docugit-linux-arm64"
      sha256 "9d33e8ba14dd773375dfea6d6b36b9f00b8bc498ef34e13cfcc57a70ac8bf7ec"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_11.33.51_376d10/docugit-linux-amd64"
      sha256 "fe75c6d3ff6092cef9c1383693f5f06c61251900b901c7b79c9d56d5c8f0cca3"
    end
  end

  def install
    if OS.mac?
      binary = Hardware::CPU.arm? ? "docugit-darwin-arm64" : "docugit-darwin-amd64"
    else
      binary = Hardware::CPU.arm? ? "docugit-linux-arm64" : "docugit-linux-amd64"
    end
    bin.install binary => "docugit"
  end

  test do
    system "#{bin}/docugit", "--version"
  end
end
