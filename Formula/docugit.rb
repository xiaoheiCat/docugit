# Updated automatically by the Release workflow after each main-branch release.
# Install: brew tap xiaoheiCat/docugit https://github.com/xiaoheiCat/docugit && brew install docugit

class Docugit < Formula
  desc "Git-based version control for Office OpenXML documents"
  homepage "https://github.com/xiaoheiCat/docugit"
  version "2026.06.01_08.07.00_749a2a"
  license "GPL-3.0"

  on_macos do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_08.07.00_749a2a/docugit-darwin-arm64"
      sha256 "fa707d9e24ab1030577dfe48af18a5e50d176ada4193388a1ea7ed3d298f897e"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_08.07.00_749a2a/docugit-darwin-amd64"
      sha256 "7877fb6c8e4c331f0a02314a2eb7c3f17e5174b31f7ef668d9d5f69ffedbb98e"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_08.07.00_749a2a/docugit-linux-arm64"
      sha256 "63fb8ecca2f59d8c74cc5cc518566c3fe4a257346acdd62771e71101d3a0dd3b"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_08.07.00_749a2a/docugit-linux-amd64"
      sha256 "764f7a2c7a1900e6f4001944d39961569ba2deb86c55662514d7c324c4152a98"
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
