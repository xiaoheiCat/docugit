# Updated automatically by the Release workflow after each main-branch release.
# Install: brew tap xiaoheiCat/docugit https://github.com/xiaoheiCat/docugit && brew install docugit

class Docugit < Formula
  desc "Git-based version control for Office OpenXML documents"
  homepage "https://github.com/xiaoheiCat/docugit"
  version "2026.06.02_16.05.30_2adab3"
  license "GPL-3.0"

  on_macos do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_16.05.30_2adab3/docugit-darwin-arm64"
      sha256 "581b73b73cc2decb7f2405fa7bc2ff2eb4eb6bc599af3f8c4228e8d4264e0bb1"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_16.05.30_2adab3/docugit-darwin-amd64"
      sha256 "9e6f4f5a39cfd8d9c771b7bb9455bf1c5c92069043286f3c1a836f2796b60260"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_16.05.30_2adab3/docugit-linux-arm64"
      sha256 "01e05c35dda329a6eaa317e2252aefe9f38246453360cb82e288dde1c2d3f22d"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_16.05.30_2adab3/docugit-linux-amd64"
      sha256 "b10f4147946ca1044dbb43255a19c599bb573145d07fb5913eba85d5c8c7bbc4"
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
